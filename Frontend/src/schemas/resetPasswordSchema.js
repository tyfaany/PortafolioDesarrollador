import * as Yup from 'yup';

const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Minimo 8 caracteres')
    .required('La contraseña es obligatoria'),
  passwordConfirmacion: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas no coinciden')
    .required('Confirma tu contraseña'),
});

export default resetPasswordSchema;
