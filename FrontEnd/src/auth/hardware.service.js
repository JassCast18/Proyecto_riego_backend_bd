import api from './api'

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors ||
    error?.message ||
    fallbackMessage
  )
}

export async function listHardwareStateRequest() {
  try {
    const response = await api.get('/nodos/estado-hardware')

    return response.data?.data?.nodos || []
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar el estado del hardware.'))
  }
}

export async function listTelemetryHardwareRequest({ idNodo = null, page = 1, limit = 15 } = {}) {
  try {
    const response = await api.get('/telemetria/listado', {
      params: {
        id_nodo: idNodo ?? undefined,
        page,
        limit,
      },
    })

    const data = response.data?.data || {}

    return {
      telemetrias: (data.telemetrias || []).map((item) => ({
        id: item.id,
        tbSensorId: item.tbSensorId ?? item.tb_sensor_id ?? null,
        tbNodoId: item.tbNodoId ?? item.tb_nodo_id ?? null,
        tipoComponente: item.tipoComponente ?? item.tipo_componente ?? 'Sin componente',
        valorLectura: item.valorLectura ?? item.valor_lectura ?? null,
        fechaHora: item.fechaHora ?? item.fecha_hora ?? null,
      })),
      pagination: data.pagination || {
        page,
        limit,
        totalRegistros: 0,
        totalPaginas: 0,
        idNodo,
      },
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible consultar la telemetría del hardware.'))
  }
}

export async function switchNodeEnergyRequest(id, estadoEnergia) {
  try {
    const response = await api.patch(`/nodos/${id}/energia`, {
      estado_energia: estadoEnergia,
    })

    return response.data?.data || {}
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'No fue posible cambiar el estado del nodo.'))
  }
}