"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui/icon";
import { mockRecognizedProduct } from "@/features/fridge/model/recognition-mock";
import type { ProductFormValues } from "@/features/fridge/model/product-schema";
import styles from "./photo-capture.module.css";

type CameraStep = "front" | "date" | "recognizing";

const SCAN_HINTS: Record<Exclude<CameraStep, "recognizing">, { title: string; text: string }> = {
  front: { title: "Снимите лицевую сторону", text: "Чтобы было видно название и объем" },
  date: { title: "Снимите место с датой", text: "Ищите «Годен до» или «Изготовлено»" },
};

const SINGLE_HINT = {
  title: "Сфотографируйте продукт",
  text: "Снимок появится в карточке",
} as const;

const RECOGNITION_DELAYS = [900, 1900] as const;
const FORM_DELAY_MS = 2600;

function captureFrame(video: HTMLVideoElement | null): Promise<Blob | null> {
  if (!video || video.videoWidth === 0) {
    return Promise.resolve(null);
  }

  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    return Promise.resolve(null);
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", 0.85);
  });
}

interface ScanCaptureProps {
  mode?: "scan";
  onClose: () => void;
  onRecognized: (values: Partial<ProductFormValues>) => void;
  onManual: () => void;
}

interface SingleCaptureProps {
  mode: "single";
  onClose: () => void;
  onPhoto: (photo: Blob) => void;
}

type PhotoCaptureProps = ScanCaptureProps | SingleCaptureProps;

export function PhotoCapture(props: PhotoCaptureProps) {
  const single = props.mode === "single";
  const onRecognized = props.mode === "single" ? null : props.onRecognized;
  const { onClose } = props;
  const [step, setStep] = useState<CameraStep>("front");
  const [cameraFailed, setCameraFailed] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [resolved, setResolved] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const capturing = single || step !== "recognizing";

  useEffect(() => {
    if (!capturing) {
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((next) => {
        if (cancelled) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = next;

        if (videoRef.current) {
          videoRef.current.srcObject = next;
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCameraFailed(true);
        }
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [capturing]);

  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [dateUrl, setDateUrl] = useState<string | null>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const rememberUrl = (blob: Blob | null): string | null => {
    if (!blob) {
      return null;
    }

    const url = URL.createObjectURL(blob);

    objectUrls.current.push(url);

    return url;
  };

  useEffect(() => {
    if (step !== "recognizing" || !onRecognized) {
      return;
    }

    const timers = [
      ...RECOGNITION_DELAYS.map((delay, index) =>
        setTimeout(() => setResolved(index + 1), delay),
      ),
      setTimeout(() => onRecognized(mockRecognizedProduct()), FORM_DELAY_MS),
    ];

    return () => timers.forEach(clearTimeout);
  }, [step, onRecognized]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const shoot = async () => {
    if (shooting) {
      return;
    }

    setShooting(true);

    try {
      const photo = await captureFrame(videoRef.current);

      if (props.mode === "single") {
        if (photo) {
          props.onPhoto(photo);
        }
        return;
      }

      if (step === "front") {
        setFrontUrl(rememberUrl(photo));
        setStep("date");
        return;
      }

      setDateUrl(rememberUrl(photo));
      setStep("recognizing");
    } finally {
      setShooting(false);
    }
  };

  if (props.mode !== "single" && step === "recognizing") {
    return (
      <div className={styles.root} role="dialog" aria-modal="true" aria-label="Распознавание упаковки">
        <div className={styles.inner}>
          <div className={styles.recognition}>
            <header className={styles.recognitionHeader}>
              <button
                type="button"
                className={styles.close}
                onClick={props.onClose}
                aria-label="Закрыть"
              >
                <Icon name="x" size={24} />
              </button>
            </header>

            <div className={styles.photos}>
              <Photo thumb={frontUrl} label="фото 1" />
              <Photo thumb={dateUrl} label="фото 2" />
            </div>

            <h1 className={styles.recognitionTitle}>Читаем упаковку…</h1>
            <p className={styles.recognitionText}>Обычно занимает несколько секунд</p>

            <div className={styles.group}>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Название</span>
                {resolved >= 1 ? (
                  <Icon name="check" size={20} className={styles.check} />
                ) : (
                  <span className={styles.spinner} />
                )}
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Срок годности</span>
                {resolved >= 2 ? (
                  <Icon name="check" size={20} className={styles.check} />
                ) : (
                  <span className={styles.spinner} />
                )}
              </div>
              <div className={styles.row}>
                <span className={[styles.rowLabel, styles.rowMuted].filter(Boolean).join(" ")}>
                  Количество
                </span>
                <span className={styles.rowValue}>—</span>
              </div>
            </div>

            <footer className={styles.recognitionFooter}>
              <button type="button" className={styles.manual} onClick={props.onManual}>
                Ввести вручную
              </button>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  const hint = single ? SINGLE_HINT : SCAN_HINTS[step as Exclude<CameraStep, "recognizing">];

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={hint.title}>
      <div className={styles.inner}>
        <div className={styles.stage}>
          <video ref={videoRef} className={styles.video} autoPlay playsInline muted />
          {cameraFailed ? (
            <div className={styles.fallback}>
              <Icon name="camera" size={28} />
              <span>Камера недоступна — разрешите доступ в настройках браузера</span>
            </div>
          ) : null}
        </div>

        <div className={styles.scrimTop} aria-hidden="true" />
        <div className={styles.scrimBottom} aria-hidden="true" />

        <div className={styles.content}>
          <header className={styles.header}>
            <button
              type="button"
              className={styles.roundButton}
              onClick={props.onClose}
              aria-label="Закрыть"
            >
              <Icon name="x" size={20} />
            </button>

            {single ? (
              <span />
            ) : (
              <span className={styles.step}>{step === "front" ? "Шаг 1 из 2" : "Шаг 2 из 2"}</span>
            )}

            {!single && step === "date" ? (
              <button type="button" className={styles.next} onClick={() => setStep("recognizing")}>
                Далее
              </button>
            ) : (
              <span />
            )}
          </header>

          <div className={styles.hint}>
            <p className={styles.hintTitle}>{hint.title}</p>
            <p className={styles.hintText}>{hint.text}</p>
          </div>

          {!single && step === "date" ? (
            <div className={styles.frameWrap} aria-hidden="true">
              <div className={styles.frame} />
            </div>
          ) : null}

          <div className={styles.controls}>
            {!single && step === "date" ? (
              <div className={[styles.photo, styles.thumb].join(" ")}>
                {frontUrl ? (
                  <PhotoImage src={frontUrl} />
                ) : (
                  <span className={[styles.photoLabel, styles.thumbnailLabel].join(" ")}>фото 1</span>
                )}
                <span className={styles.thumbCheck}>
                  <Icon name="check" size={12} />
                </span>
              </div>
            ) : (
              <span />
            )}

            <button
              type="button"
              className={styles.shutter}
              onClick={shoot}
              disabled={shooting}
              aria-label="Сделать снимок"
            >
              <span className={styles.shutterInner} />
            </button>

            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoImage({ src }: { src: string }) {
  return (
      // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={styles.photoImage} />
  );
}

function Photo({ thumb, label }: { thumb: string | null; label: string }) {
  return (
    <div className={styles.photo}>
      {thumb ? <PhotoImage src={thumb} /> : <span className={styles.photoLabel}>{label}</span>}
    </div>
  );
}
