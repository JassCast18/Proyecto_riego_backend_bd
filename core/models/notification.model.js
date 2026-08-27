export default class Notification {
    constructor(data = {}) {
        this.id = data.id;
        this.tbNodoId = data.tb_nodo_id ?? data.tbNodoId ?? null;
        this.categoria = data.categoria;
        this.tipo = data.tipo;
        this.titulo = data.titulo;
        this.mensaje = data.mensaje;
        this.severidad = data.severidad;
        this.estado = data.estado;
        this.descartable = Boolean(data.descartable);
        this.fechaCreacion = data.fecha_creacion ?? data.fechaCreacion;
        this.fechaActualizacion = data.fecha_actualizacion ?? data.fechaActualizacion;
        this.fechaResolucion = data.fecha_resolucion ?? data.fechaResolucion ?? null;
        this.revisada = Boolean(data.revisada);
        this.reconocidaPor = data.reconocida_por ?? data.reconocidaPor ?? null;
        this.reconocidoPorNombre = data.reconocido_por_nombre ?? data.reconocidoPorNombre ?? "";
        this.fechaReconocimiento = data.fecha_reconocimiento ?? data.fechaReconocimiento ?? null;
        this.fechaPrimeraDeteccion = data.fecha_primera_deteccion ?? data.fechaPrimeraDeteccion;
        this.fechaUltimaDeteccion = data.fecha_ultima_deteccion ?? data.fechaUltimaDeteccion;
        this.ocurrencias = Number(data.ocurrencias ?? 1);
        this.correoEnviado = Boolean(data.correo_enviado ?? data.correoEnviado);
        this.estadoCorreo = data.estado_correo ?? data.estadoCorreo ?? null;
        this.revisadaPor = data.revisada_por ?? data.revisadaPor ?? null;
        this.revisadaPorNombre = data.revisada_por_nombre ?? data.revisadaPorNombre ?? "";
        this.fechaRevision = data.fecha_revision ?? data.fechaRevision ?? null;
        this.totalRegistros = Number(data.total_registros ?? data.totalRegistros ?? 0);
    }

    toResponse() {
        return { ...this };
    }
}
