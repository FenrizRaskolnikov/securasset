$BaseUrl = "http://127.0.0.1:8090"
$Output = Join-Path $PSScriptRoot "schema.mmd"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " PocketBase Schema -> Mermaid" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# 1. AUTENTICACIÓN COMO SUPERUSER
# ============================================================

Write-Host "Autenticación de PocketBase" -ForegroundColor Yellow
Write-Host ""

$email = Read-Host "Email del administrador"
$passwordSecure = Read-Host "Contraseña" -AsSecureString

$passwordPlain = [System.Net.NetworkCredential]::new(
    "",
    $passwordSecure
).Password

$authBody = @{
    identity = $email
    password = $passwordPlain
} | ConvertTo-Json

try {
    Write-Host ""
    Write-Host "Autenticando..." -ForegroundColor Yellow

    $auth = Invoke-RestMethod `
        -Uri "$BaseUrl/api/collections/_superusers/auth-with-password" `
        -Method Post `
        -ContentType "application/json" `
        -Body $authBody `
        -ErrorAction Stop

    $token = $auth.token

    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "PocketBase no devolvió un token."
    }

    Write-Host "Autenticación correcta." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "ERROR: No se pudo autenticar con PocketBase." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# ============================================================
# 2. OBTENER COLECCIONES
# ============================================================

Write-Host ""
Write-Host "Obteniendo colecciones..." -ForegroundColor Yellow

$headers = @{
    Authorization = $token
}

try {
    $response = Invoke-RestMethod `
        -Uri "$BaseUrl/api/collections?perPage=500" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    $collections = @($response.items)
}
catch {
    Write-Host ""
    Write-Host "ERROR: No se pudieron obtener las colecciones." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

if ($collections.Count -eq 0) {
    Write-Host ""
    Write-Host "No se encontraron colecciones." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Colecciones encontradas: $($collections.Count)" -ForegroundColor Green

# Crear mapa ID -> nombre
$collectionMap = @{}

foreach ($collection in $collections) {
    $collectionMap[$collection.id] = $collection.name
}

# ============================================================
# 3. FUNCIONES AUXILIARES
# ============================================================

function Get-MermaidName {
    param (
        [string]$Name
    )

    if ([string]::IsNullOrWhiteSpace($Name)) {
        return "unknown"
    }

    $clean = $Name -replace '[^a-zA-Z0-9_]', '_'

    if ($clean -match '^[0-9]') {
        $clean = "_" + $clean
    }

    return $clean
}

function Get-MermaidType {
    param (
        [string]$PocketBaseType
    )

    switch ($PocketBaseType) {
        "text" {
            return "string"
        }

        "email" {
            return "string"
        }

        "url" {
            return "string"
        }

        "number" {
            return "number"
        }

        "bool" {
            return "boolean"
        }

        "date" {
            return "datetime"
        }

        "relation" {
            return "string"
        }

        "select" {
            return "string"
        }

        "file" {
            return "string"
        }

        "json" {
            return "json"
        }

        "autodate" {
            return "datetime"
        }

        default {
            return "string"
        }
    }
}

# ============================================================
# 4. GENERAR DIAGRAMA
# ============================================================

$lines = New-Object System.Collections.Generic.List[string]

$lines.Add("erDiagram")
$lines.Add("")

# ============================================================
# 5. GENERAR ENTIDADES
# ============================================================

Write-Host ""
Write-Host "Generando entidades..." -ForegroundColor Yellow
Write-Host ""

foreach ($collection in $collections) {

    $collectionName = Get-MermaidName $collection.name

    Write-Host "  $($collection.name)" -ForegroundColor Gray

    $lines.Add("    $collectionName {")

    # Todos los registros de PocketBase tienen id
    $lines.Add("        string id PK")

    if ($null -ne $collection.fields) {

        foreach ($field in $collection.fields) {

            $fieldName = Get-MermaidName $field.name

            # No duplicar id
            if ($field.name -eq "id") {
                continue
            }

            $fieldType = Get-MermaidType $field.type

            # Marcar relaciones como FK
            if ($field.type -eq "relation") {
                $lines.Add("        $fieldType $fieldName FK")
            }
            else {
                $lines.Add("        $fieldType $fieldName")
            }
        }
    }

    $lines.Add("    }")
    $lines.Add("")
}

# ============================================================
# 6. GENERAR RELACIONES
# ============================================================

Write-Host ""
Write-Host "Detectando relaciones..." -ForegroundColor Yellow
Write-Host ""

$relationshipCount = 0

foreach ($collection in $collections) {

    $sourceName = Get-MermaidName $collection.name

    if ($null -eq $collection.fields) {
        continue
    }

    foreach ($field in $collection.fields) {

        if ($field.type -ne "relation") {
            continue
        }

        if ([string]::IsNullOrWhiteSpace($field.collectionId)) {
            continue
        }

        if (-not $collectionMap.ContainsKey($field.collectionId)) {
            Write-Host "  Destino no encontrado: $($collection.name).$($field.name)" -ForegroundColor DarkYellow
            continue
        }

        $targetOriginalName = $collectionMap[$field.collectionId]
        $targetName = Get-MermaidName $targetOriginalName

        $relationName = Get-MermaidName $field.name

        # PocketBase utiliza maxSelect para indicar
        # relaciones múltiples.
        $isMultiple = $false

        if ($null -ne $field.maxSelect) {
            try {
                if ([int]$field.maxSelect -gt 1) {
                    $isMultiple = $true
                }
            }
            catch {
                $isMultiple = $false
            }
        }

        if ($isMultiple) {

            # Una colección puede relacionarse con múltiples
            # registros de la colección destino.
            $line = "    $sourceName }o--o{ $targetName : `"$relationName`""

        }
        else {

            # Relación hacia un único registro.
            $line = "    $sourceName }o--|| $targetName : `"$relationName`""
        }

        $lines.Add($line)

        Write-Host "  $($collection.name).$($field.name) -> $targetOriginalName" -ForegroundColor Green

        $relationshipCount++
    }
}

# ============================================================
# 7. ELIMINAR RELACIONES DUPLICADAS
# ============================================================

$uniqueLines = New-Object System.Collections.Generic.List[string]

$seenRelationships = @{}

foreach ($line in $lines) {

    if ($line -match '^\s+\w+\s+(\}o--o\{|\}o--\|\|)\s+\w+\s+:') {

        if (-not $seenRelationships.ContainsKey($line)) {

            $seenRelationships[$line] = $true
            $uniqueLines.Add($line)
        }

    }
    else {

        $uniqueLines.Add($line)
    }
}

# ============================================================
# 8. GUARDAR ARCHIVO
# ============================================================

try {

    $uniqueLines | Set-Content `
        -Path $Output `
        -Encoding UTF8 `
        -ErrorAction Stop

}
catch {

    Write-Host ""
    Write-Host "ERROR: No se pudo escribir $Output" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# ============================================================
# 9. RESULTADO
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DIAGRAMA GENERADO CORRECTAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Colecciones:  $($collections.Count)" -ForegroundColor White
Write-Host "Relaciones:   $relationshipCount" -ForegroundColor White
Write-Host ""

Write-Host "Archivo generado:" -ForegroundColor Yellow
Write-Host $Output -ForegroundColor White
Write-Host ""

Write-Host "Puedes visualizarlo en Mermaid Live Editor:" -ForegroundColor Cyan
Write-Host "https://mermaid.live/" -ForegroundColor Gray
Write-Host ""

# Limpiar variables sensibles
$passwordPlain = $null
$passwordSecure = $null
$token = $null