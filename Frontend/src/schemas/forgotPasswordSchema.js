import * as Yup from 'yup';

const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email('Formato de correo invalido')
    .required('El correo es obligatorio'),
});

export default forgotPasswordSchema;
