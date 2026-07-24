export default class Usuario {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.tbPersonaId = data.tb_persona_id ?? null;
        this.tbRolId = data.tb_rol_id ?? null;
        this.correoElectronico = data.correo_electronico ?? "";
        this.username = data.username ?? "";
        this.passwordHash = data.password_hash ?? "";
        this.nombres = data.nombres ?? "";
        this.apellidos = data.apellidos ?? "";
        this.nombreCompleto = data.nombre_completo ?? "";
        this.rol = data.rol ?? "";
        this.snActivo = data.sn_activo ?? data.snActivo ?? true;
        this.codUsuarioRegistro = data.cod_usuario_registro ?? data.codUsuarioRegistro ?? null;
        this.fechaRegistra = data.fecha_registra ?? data.fechaRegistra ?? null;
        this.codUsuarioModifica = data.cod_usuario_modifica ?? data.codUsuarioModifica ?? null;
        this.fechaModifica = data.fecha_modifica ?? data.fechaModifica ?? null;
        this.permisos = data.permisos ?? data.permissions ?? [];
    }

    toResponse() {
        return {
            id: this.id,
            nombreCompleto: this.nombreCompleto,
            correoElectronico: this.correoElectronico,
            username: this.username,
            rol: this.rol,
            tbRolId: this.tbRolId,
            permisos: this.permisos
        };
    }

    toAdminResponse() {
        return {
            id: this.id,
            tbPersonaId: this.tbPersonaId,
            tbRolId: this.tbRolId,
            nombres: this.nombres,
            apellidos: this.apellidos,
            nombreCompleto: this.nombreCompleto,
            correoElectronico: this.correoElectronico,
            username: this.username,
            rol: this.rol,
            snActivo: this.snActivo,
            codUsuarioRegistro: this.codUsuarioRegistro,
            fechaRegistra: this.fechaRegistra,
            codUsuarioModifica: this.codUsuarioModifica,
            fechaModifica: this.fechaModifica,
        };
    }
}