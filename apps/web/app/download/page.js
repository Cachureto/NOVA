import { QRCodeSVG } from 'qrcode.react';
import { Bell, Download, Hammer, ScanLine, ShieldCheck, Smartphone } from 'lucide-react';

export const metadata = { title: 'Descarga la app' };

const APK_URL = process.env.NEXT_PUBLIC_APK_URL;

const FEATURES = [
  {
    icon: ScanLine,
    title: 'Escáner de autenticidad',
    text: 'Apunta la cámara al QR del producto y confirma en segundos si es original.',
  },
  { icon: Bell, title: 'Alertas de drops', text: 'Notificaciones push cuando se anuncia un lanzamiento.' },
  {
    icon: Smartphone,
    title: 'Tu cuenta en el bolsillo',
    text: 'Catálogo, pedidos y reseñas con el mismo login de la web.',
  },
];

export default function DownloadPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="bg-grid mask-fade pointer-events-none absolute inset-0" />
      <div className="glow-accent pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2" />

      <div className="container-page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div>
          <span className="badge-accent">
            <Smartphone size={13} /> App NOVA · Android
          </span>
          <h1 className="display mt-6 text-4xl leading-[1.05] sm:text-6xl">
            NOVA en tu <span className="text-accent">bolsillo.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted">
            Valida la autenticidad de un producto físico con la cámara y entérate primero de cada drop.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-accent">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card relative mx-auto w-full max-w-md p-8 text-center sm:p-10">
          {APK_URL ? (
            <>
              <p className="eyebrow">Escanea para descargar</p>
              <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-5">
                <QRCodeSVG value={APK_URL} size={200} bgColor="#ffffff" fgColor="#09090b" level="M" />
              </div>
              <a href={APK_URL} className="btn-primary mt-8 h-12 w-full text-[15px]">
                <Download size={18} /> Descargar APK
              </a>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                <ShieldCheck size={14} className="text-live" /> Android 8+ · Permite instalar apps de origen desconocido
              </p>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Hammer size={26} />
              </span>
              <h2 className="display mt-6 text-2xl">La app está en construcción</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                En cuanto publiquemos el primer build con EAS, el botón de descarga y el código QR aparecerán aquí
                automáticamente.
              </p>
              <p className="mt-6 rounded-xl border border-border bg-background px-4 py-3 font-mono text-xs text-subtle">
                NEXT_PUBLIC_APK_URL
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
