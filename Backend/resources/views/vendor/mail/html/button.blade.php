@props([
    'url',
    'color' => 'primary',
    'align' => 'center',
])
<table class="action" align="{{ $align }}" width="100%" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td align="{{ $align }}">
<table border="0" cellpadding="0" cellspacing="0" role="presentation">
<tr>
<td>
<a href="{{ $url }}" target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:15px 24px;border-radius:12px;background:linear-gradient(180deg,#e67e22 0%,#d35400 100%);color:#ffffff;font-family:'Poppins','Roboto',Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.2;text-decoration:none;box-shadow:0 10px 20px rgba(230,126,34,0.24);">
    {{ $slot }}
</a>
</td>
</tr>
</table>
</td>
</tr>
</table>
