<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(Request $request): RedirectResponse
    {
        $user = User::findOrFail($request->route('id'));

        $hashMatches = hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()));

        if (! $hashMatches) {
            abort(403);
        }

        $alreadyVerified = ! empty($user->email_verified_at) || $user->hasVerifiedEmail();

        if ($alreadyVerified) {
            return redirect()->intended(
                config('app.frontend_url').'/login?verified=1'
            );
        }

        $verified = $user->markEmailAsVerified();

        if (! $verified) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();
        }

        $user->refresh();
        event(new Verified($user));

        return redirect()->intended(
            config('app.frontend_url').'/login?verified=1'
        );
    }
}
