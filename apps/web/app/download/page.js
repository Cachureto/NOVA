import { QRCodeSVG } from 'qrcode.react';

export const metadata = { title: 'Descarga la app — NOVA' };

const APK_URL = process.env.NEXT_PUBLIC_APK_URL;

export default function DownloadPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
      <h1 className="text-3xl font-bold">Descarga la app de NOVA</h1>
      <p className="text-muted">
        Escanea productos con la cámara para validar su autenticidad al instante y recibe notificaciones cuando se
        anuncie un nuevo drop.
      </p>

      {APK_URL ? (
        <>
          <div className="card p-6">
            <QRCodeSVG value={APK_URL} size={220} bgColor="transparent" fgColor="#f4f4f5" />
          </div>
          <a href={APK_URL} className="btn-primary">
            Descargar APK
          </a>
          <p className="text-xs text-muted">Android 8+ · Habilita &quot;orígenes desconocidos&quot; para instalar.</p>
        </>
      ) : (
        <div className="card p-8">
          <p className="font-medium">La app móvil todavía está en construcción</p>
          <p className="mt-2 text-sm text-muted">
            En cuanto publiquemos el primer build con EAS, el botón de descarga y el código QR aparecerán aquí
            automáticamente (configurable con la variable <code>NEXT_PUBLIC_APK_URL</code>).
          </p>
        </div>
      )}
    </div>
  );
}
