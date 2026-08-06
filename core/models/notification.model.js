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
    }

    toResponse() {
        return { ...this };
    }
}
