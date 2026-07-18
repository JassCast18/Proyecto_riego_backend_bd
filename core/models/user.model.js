export default class Usuario {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.tbPersonaId = data.tb_persona_id ?? null;
        this.tbRolId = data.tb_rol_id ?? null;
        this.correoElectronico = data.correo_electronico ?? "";
        this.passwordHash = data.password_hash ?? "";
        this.nombreCompleto = data.nombre_completo ?? "";
        this.rol = data.rol ?? "";
        this.snActivo = data.snActivo ?? true;
        this.codUsuarioRegistro = data.codUsuarioRegistro ?? null;
        this.fechaRegistra = data.fechaRegistra ?? null;
        this.codUsuarioModifica = data.codUsuarioModifica ?? null;
        this.fechaModifica = data.fechaModifica ?? null;
    }

    toResponse() {
        return {
            nombreCompleto: this.nombreCompleto,
            correoElectronico: this.correoElectronico,
            rol: this.rol
        };
    }
}