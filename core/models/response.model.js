export default class ResponseModel {

    constructor(
        statusCode = 200,
        success = false,
        message = "",
        data = null,
        errors = null
    ) {
        this.statusCode = statusCode;
        this.success = success;
        this.message = message;
        this.data = data;
        this.errors = errors;
        this.timestamp = new Date().toISOString();
    }

    static ok(data = null, message = "Operación realizada correctamente.", statusCode = 200) {
        return new ResponseModel(
            statusCode,
            true,
            message,
            data,
            null
        );
    }

    static fail(message = "Ocurrió un error.", errors = null, statusCode = 500) {
        return new ResponseModel(
            statusCode,
            false,
            message,
            null,
            errors
        );
    }

}