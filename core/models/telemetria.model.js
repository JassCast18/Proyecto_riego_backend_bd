export default class Telemetria {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.tbSensorId = data.tb_sensor_id ?? data.tbSensorId ?? null;
        this.valorLectura = data.valor_lectura != null ? parseFloat(data.valor_lectura) : null;
        this.fechaHora = data.fecha_hora ?? data.fechaHora ?? null;
        this.tipoComponente = data.tipo_componente ?? data.tipoComponente ?? ""; // Ej: 'Higrometro_A0' o 'Termometro_DS18B20'
        this.tbNodoId = data.tb_nodo_id ?? data.tbNodoId ?? null;
    }

    toResponse() {
        return {
            id: this.id,
            valorLectura: this.valorLectura,
            fechaHora: this.fechaHora,
            tipoComponente: this.tipoComponente 
        };
    }

    toAdminResponse() {
        return {
            id: this.id,
            tbSensorId: this.tbSensorId,
            valorLectura: this.valorLectura,
            fechaHora: this.fechaHora,
            tipoComponente: this.tipoComponente,
            tbNodoId: this.tbNodoId
        };
    }
}