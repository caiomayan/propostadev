import { LoadingScreen } from "@/components/loading-screen";

// Só as seções sem notFound() ficam neste grupo: acima de uma rota com notFound(), o loading faria o 404 responder 200.
export default function PanelLoading() {
  return <LoadingScreen label="Carregando o painel…" contained={false}/>;
}
