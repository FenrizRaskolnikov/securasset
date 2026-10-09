export interface Vulnerabilidad {
  cve: string;
  severidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  descripcion: string;
}

export interface DispositivoShadowIT {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  tipoDispositivo: string;
  sistemaOperativo: string;
  puertosAbiertos: number[];
  vulnerabilidades: Vulnerabilidad[];
  scoreSeguridad: number; // 0 - 100
  estadoShadow: 'Detectado' | 'En Cuarentena' | 'Aprobado' | 'No Autorizado';
  fechaDeteccion: string;
}