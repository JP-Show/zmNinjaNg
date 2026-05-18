// src/pages/StandaloneMontage.tsx
import { useSearchParams } from 'react-router-dom';
import { useProfileStore } from '../stores/profile';
import { useMemo } from 'react';
import Montage from './Montage';

export default function StandaloneMontage() {
  // Extrai o identificador do perfil transmitido via query string
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profileId');
  const profiles = useProfileStore((state) => state.profiles);

  // Isola a configuração do servidor específico selecionado no modal
  const targetProfile = useMemo(() => {
    return profiles.find((p) => p.id === profileId);
  }, [profiles, profileId]);

  // Bloqueio de renderização caso a URL seja acessada sem parâmetros válidos
  if (!targetProfile) {
    return <div>Invalid Profile</div>;
  }

  // Renderiza o componente principal ocupando a janela inteira.
  // Nota arquitetural: O componente <Montage /> original precisará ser modificado 
  // para aceitar a prop `standaloneProfile` e utilizar estas credenciais em vez 
  // de utilizar a função `useCurrentProfile()` global de forma imperativa.
  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
       <Montage standaloneProfile={targetProfile} />
    </div>
  );
}