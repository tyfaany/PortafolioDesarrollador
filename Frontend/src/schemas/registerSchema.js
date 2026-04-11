import * as Yup from 'yup';

const registerSchema = Yup.object({
  nombre: Yup.string()
    .max(20, 'El nombre no debe superar 20 caracteres')
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
