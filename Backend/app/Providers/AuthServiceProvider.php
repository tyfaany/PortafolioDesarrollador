<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        VerifyEmail::createUrlUsing(function (object $notifiable) {
            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(config('auth.verification.expire', 60)),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );
        });

        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->subject('Verificación de correo electrónico')
                ->greeting('Hola '.$notifiable->name.',')
                ->line('Recibiste este mensaje porque creaste una cuenta en el sistema Portafolio.')
                ->line('Haz clic en el botón de abajo para verificar tu correo electrónico.')
                ->action('Verificar correo electrónico', $url)
                ->salutation('DevStack')
                ->line('Si no solicitaste esta cuenta, puedes ignorar este correo.');
        });

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            // Lee la variable FRONTEND_URL de tu archivo .env local
            $baseUrl = config('app.frontend_url') ?? 'FRONTEND_URL=http://softsave.tis.cs.umss.edu.bo';
            return rtrim($baseUrl, '/') . "/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });

       
        ResetPassword::toMailUsing(function (object $notifiable, string $token) {
            // Construimos la URL local usando el token
            $baseUrl = config('app.frontend_url') ?? 'FRONTEND_URL=http://softsave.tis.cs.umss.edu.bo';
            $frontendUrl = rtrim($baseUrl, '/') . "/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";

            return (new MailMessage)
                ->subject('Restablecimiento de contraseña (Local)')
                ->greeting('Hola '.$notifiable->name.',')
                ->line('Recibiste este mensaje porque solicitaste restablecer tu contraseña en DevStack.')
                ->line('Haz clic en el botón de abajo para elegir una nueva contraseña.')
                ->action('Restablecer contraseña', $frontendUrl) 
                ->salutation('DevStack')
                ->line('Si no solicitaste este cambio, puedes ignorar este correo.');
        });
        //
    }
}
