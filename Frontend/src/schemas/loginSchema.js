import * as Yup from 'yup';

const loginSchema = Yup.object({
  email: Yup.string()
    .email('Formato de correo invalido')
    .required('El correo es obligatorio'),
  password: Yup.string()
    .required('La contraseña es obligatoria'),
});

export default loginSchema;
