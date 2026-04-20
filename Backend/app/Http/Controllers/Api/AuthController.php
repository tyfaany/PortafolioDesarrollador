<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
                'email' => Str::lower(Str::squish($request->email)), // Limpiamos y pasamos a minúsculas
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
            'message' => 'Usuario registrado correctamente',
            'user' => $user,
            'token' => $token,
        ], 201);
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

        // Extraemos las credenciales y el valor de remember (si no lo envían, es false)
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        // Pasamos el $remember al intento de autenticación
        if (!Auth::attempt($credentials, $remember)) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        $user = User::where('email', $request->email)->first();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente'
        ]);
    }

    /**
     * Enviar enlace de recuperación de contraseña
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Laravel busca el correo y envía el link automáticamente (requiere SMTP en .env)
        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json(['message' => 'Enlace de recuperación enviado al correo']);
        }

        return response()->json(['message' => 'No pudimos encontrar un usuario con ese correo'], 400);
    }

    public function resetPassword(Request $request)
    {
        // 1. Validamos que el Frontend nos envíe todo lo necesario
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        // 2. Laravel busca el token y el correo, y si coinciden, cambia la contraseña
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, string $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );

        // 3. Respondemos según el resultado
        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Contraseña restablecida correctamente'
            ], 200);
        }

        return response()->json([
            'message' => 'El token es inválido o el correo no coincide'
        ], 400);
    }

    /**
     * Subir o actualizar foto de perfil
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed|different:current_password',
        ], [
            'password.different' => 'La nueva contraseña debe ser diferente a la actual.'
        ]);

        $user = $request->user();

    
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta'
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'message' => 'actualizacion exitosa'
        ], 200);
    }
    public function uploadPhoto(Request $request)
    {
        // 1. Validamos que el archivo sea una imagen válida y pese máximo 2MB
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        $user = $request->user();

        // 2. Si el usuario ya tenía una foto, la borramos para no llenar el servidor de archivos viejos
        if ($user->profile_photo) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        // 3. Guardamos la nueva foto en la carpeta 'profile_photos'
        $path = $request->file('photo')->store('profile_photos', 'public');

        // 4. Actualizamos la ruta en la base de datos
        $user->profile_photo = $path;
        $user->save();

        // 5. Devolvemos una respuesta exitosa con la URL completa de la imagen para que React la muestre
        return response()->json([
            'message' => 'Foto de perfil actualizada correctamente',
            'photo_url' => $user->profile_photo_url
        ], 200);
    }
}
