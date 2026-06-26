import * as Yup from 'yup';

const registerSchema = Yup.object({
  nombre: Yup.string()
    .max(50, 'El nombre no debe superar 50 caracteres')
    .matches(/^\p{L}+(?: \p{L}+)*$/u, 'El nombre solo puede contener letras y espacios individuales')
    .required('El nombre es obligatorio'),
  email: Yup.string()
    .email('Formato de correo invalido')
    .required('El correo es obligatorio'),
  password: Yup.string()
    .min(8, 'Minimo 8 caracteres')
    .required('La contraseña es obligatoria'),
  passwordConfirmacion: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

export default registerSchema;
