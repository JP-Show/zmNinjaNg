// src/components/MontageProfileDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useProfileStore } from '../stores/profile';
import { useTranslation } from 'react-i18next';

// Importação da API de janelas do Tauri
// Nota: Se estiver utilizando Tauri v2, altere para '@tauri-apps/api/webviewWindow'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'; 

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MontageProfileDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const profiles = useProfileStore((state) => state.profiles);

  const handleSelect = (profileId: string) => {
    // Define um identificador único para a nova janela desktop
    const windowLabel = `montage-standalone-${profileId}-${Date.now()}`;

    // Cria a nova instância de janela nativa do Tauri
    const webview = new WebviewWindow(windowLabel, {
      url: `index.html#/montage-standalone?profileId=${profileId}`,
      title: 'Standalone Montage',
      width: 1280,
      height: 720,
    });

    // Escuta eventos de inicialização para depuração no terminal
    webview.once('tauri://created', () => {
      console.log(`Janela ${windowLabel} criada.`);
    });

    webview.once('tauri://error', (e) => {
      console.error('Erro ao abrir janela do Tauri:', e);
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('profiles.select_profile')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          {profiles.map((profile) => (
            <Button key={profile.id} variant="outline" onClick={() => handleSelect(profile.id)}>
              {profile.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}