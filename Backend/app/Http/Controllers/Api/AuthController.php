<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use App\Models\SocialAccount;


class AuthController extends Controller
{
    /**
     * Registro de usuario
     */
    public function register(Request $request)
    {
        // 1. Sanitizamos los datos ANTES de validar
        if ($request->has('name')) {
            $request->merge([
                'name' => Str::squish($request->name),
                'email' => Str::lower(Str::squish($request->email)),
            ]);
        }

        // 2. Validamos
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ]);

        // 3. Creamos el usuario
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Usuario registrado correctamente.',
            'user' => $user,
            'token' => $token,
        ], 201, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Login
     */
    public function login(Request $request)
    {
        // Limpiamos el email antes de hacer nada
        if ($request->has('email')) {
            $request->merge([
                'email' => Str::lower(Str::squish($request->email))
            ]);
        }

        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember' => 'boolean'
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (!Auth::attempt($credentials, $remember)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales incorrectas.'
            ], 401, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }

        $user = User::where('email', $request->email)->first();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Inicio de sesion exitoso.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Sesion cerrada correctamente.'
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Enviar enlace de recuperación de contraseña
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'status' => 'success',
                'message' => 'Enlace de recuperacion enviado al correo.'
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'No pudimos encontrar un usuario con ese correo.'
        ], 400, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Restablecer contraseña
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'status' => 'success',
                'message' => 'Contrasena restablecida correctamente.'
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'El token es invalido o el correo no coincide.'
        ], 400, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Actualizar contraseña
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed|different:current_password',
        ], [
            'password.different' => 'La nueva contrasena debe ser diferente a la actual.'
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'La contrasena actual es incorrecta.'
            ], 422, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Actualizacion exitosa.'
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Subir o actualizar foto de perfil
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        $user = $request->user();

        try {
            $disk = Storage::disk('public');
            if (! $disk->exists('profile_photos')) {
                $disk->makeDirectory('profile_photos');
            }

            if ($user->profile_photo) {
                $disk->delete($user->profile_photo);
            }

            $path = $request->file('photo')->store('profile_photos', 'public');

            if (! $path) {
                Log::error('No se pudo guardar la imagen en disco public', [
                    'user_id' => $user->id ?? null,
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'No se pudo guardar la imagen en el servidor.',
                ], 500, [], JSON_INVALID_UTF8_SUBSTITUTE);
            }

            $user->profile_photo = $path;
            $user->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Foto de perfil actualizada correctamente.',
                'photo_url' => $user->profile_photo_url,
            ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
        } catch (\Throwable $e) {
            Log::error('Error al subir foto de perfil', [
                'user_id' => $user->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Ocurrio un error interno al subir la foto.',
            ], 500, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }
    }

    /**
     * Obtener datos de perfil importables desde una cuenta LinkedIn vinculada.
     */
    public function getLinkedInProfile(Request $request)
    {
        $user = $request->user();

        $socialAccount = SocialAccount::where('user_id', $user->id)
            ->where('provider', 'linkedin')
            ->first();

        if (! $socialAccount) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes una cuenta de LinkedIn vinculada.',
            ], 404, [], JSON_INVALID_UTF8_SUBSTITUTE);
        }

        $fotografia = $socialAccount->avatar ?: $user->profile_photo_url;

        return response()->json([
            'status' => 'success',
            'message' => 'Perfil de LinkedIn obtenido correctamente.',
            'data' => [
                'nombreCompleto' => $user->name,
                'fotografia' => $fotografia,
            ],
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Desvincular cuenta de LinkedIn del usuario autenticado.
     */
    public function unlinkLinkedIn(Request $request)
    {
        $user = $request->user();

        $eliminadas = SocialAccount::where('user_id', $user->id)
            ->where('provider', 'linkedin')
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => $eliminadas > 0
                ? 'Cuenta de LinkedIn desvinculada correctamente.'
                : 'No habia una cuenta de LinkedIn vinculada.',
        ], 200, [], JSON_INVALID_UTF8_SUBSTITUTE);
    }

    /**
     * Autenticación y Registro con LinkedIn vía API (Postman/Frontend)
     */
     public function redirect()
    {
        return Socialite::driver('linkedin-openid')
            ->scopes(['openid', 'profile', 'email'])
            ->stateless()
            ->redirect();
    }

    public function handleLinkedInCallback()
{
    try {

        $linkedinUser = Socialite::driver('linkedin-openid')
            ->stateless()
            ->user();

        // 1️⃣ Buscar si ya existe esta cuenta social
        $socialAccount = SocialAccount::where('provider', 'linkedin')
            ->where('provider_id', $linkedinUser->getId())
            ->first();

        if ($socialAccount) {

            // Ya existe → login directo
            $user = $socialAccount->user;
            $avatarActualizado = $linkedinUser->getAvatar();

            if (!empty($avatarActualizado)) {
                $socialAccount->avatar = $avatarActualizado;
                $socialAccount->save();
            }

            if (!empty($avatarActualizado) && empty($user->profile_photo)) {
                $user->profile_photo = $avatarActualizado;
                $user->save();
            }
        } else {

            // 2️⃣ Buscar usuario por email
            $user = User::where('email', $linkedinUser->getEmail())->first();

            if (!$user) {
                // 3️⃣ Si no existe → crear usuario nuevo
                $user = User::create([
                    'name' => $linkedinUser->getName(),
                    'email' => $linkedinUser->getEmail(),
                    'password' => null,
                ]);
            }

            // 4️⃣ Crear registro en social_accounts
            $avatarLinkedin = $linkedinUser->getAvatar();

            SocialAccount::create([
                'user_id' => $user->id,
                'provider' => 'linkedin',
                'provider_id' => $linkedinUser->getId(),
                'avatar' => $avatarLinkedin,
            ]);

            if (!empty($avatarLinkedin) && empty($user->profile_photo)) {
                $user->profile_photo = $avatarLinkedin;
                $user->save();
            }
        }

        // 5️⃣ Generar token
        $token = $user->createToken('auth_token')->plainTextToken;

        return redirect()->away(
    env('FRONTEND_URL') . '/auth/callback?token=' . $token
);
    } catch (\Throwable $e) {

        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage()
        ], 400);
    }
}

}
