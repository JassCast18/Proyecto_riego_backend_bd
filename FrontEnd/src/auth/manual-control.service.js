import api from './api'
const message=(e,f)=>e?.response?.data?.message||e?.message||f
export async function listManualCatalogRequest(){try{return (await api.get('/control-manual/catalogo')).data?.data?.nodos||[]}catch(e){throw new Error(message(e,'No fue posible consultar nodos y componentes.'))}}
export async function listManualTestsRequest(type){try{return (await api.get('/control-manual/pruebas',{params:{tipo:type}})).data?.data?.pruebas||[]}catch(e){throw new Error(message(e,'No fue posible consultar las pruebas.'))}}
export async function getManualTestRequest(id){try{return (await api.get(`/control-manual/pruebas/${id}`)).data?.data?.prueba}catch(e){throw new Error(message(e,'No fue posible consultar la prueba.'))}}
export async function startManualTestRequest(payload){try{return (await api.post('/control-manual/pruebas',payload)).data?.data}catch(e){throw new Error(message(e,'No fue posible iniciar la prueba.'))}}
export async function finishManualTestRequest(id,payload){try{return (await api.patch(`/control-manual/pruebas/${id}/finalizar`,payload)).data?.message}catch(e){throw new Error(message(e,'No fue posible finalizar la prueba.'))}}
export async function createActuatorRequest(payload){try{return (await api.post('/control-manual/actuadores',payload)).data?.message}catch(e){throw new Error(message(e,'No fue posible registrar la válvula.'))}}
