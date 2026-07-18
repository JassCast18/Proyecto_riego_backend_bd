import bcrypt from "bcrypt";

const SALT=10;

export const encryptPassword=async(password)=>{

    return await bcrypt.hash(password,SALT);

}

export const comparePassword=async(password,hash)=>{

    return await bcrypt.compare(password,hash);

}