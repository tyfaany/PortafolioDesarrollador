<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
// --- IMPORTANTES: Estas importaciones faltaban ---
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Study extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'academic_institution',
        'degree',
        'start_date',
        'end_date',
        'achievements',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Esto hace que 'formatted_start_date' aparezca 
     * automáticamente en el JSON que envías a React.
     */
    protected $appends = [
        'formatted_start_date',
        'formatted_end_date', // Te sugiero añadir este también
    ];

    /**
     * Relación: Un estudio pertenece a un usuario.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Accessor para la fecha de inicio
     */
    protected function formattedStartDate(): Attribute
    {
        return Attribute::get(fn () => $this->start_date?->format('M Y'));
    }

    /**
     * Bonus: Accessor para la fecha de fin (Maneja el caso de "Presente")
     */
    protected function formattedEndDate(): Attribute
    {
        return Attribute::get(fn () => $this->end_date 
            ? $this->end_date->format('M Y') 
            : 'Presente'
        );
    }
}