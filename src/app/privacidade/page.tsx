import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { smtpSettings } from "@/lib/email/mailer";

export const metadata: Metadata = { title: "Política de Privacidade", description: "Quais dados a Proposta.dev guarda, como usa e com quem compartilha." };

// Lê o remetente por requisição: é o mesmo endereço que já aparece nos e-mails enviados pela plataforma.
export default async function PrivacyPage() {
  await connection();
  const contact = smtpSettings().from;
  return <article className="container section legal">
    <div className="page-heading"><h1>Política de Privacidade</h1><p>Atualizada em 3 de novembro de 2026.</p></div>
    <p>A Proposta.dev é um projeto acadêmico que conecta quem precisa de um serviço de desenvolvimento a quem o oferece. Esta página explica quais dados guardamos, como usamos e com quem compartilhamos.</p>
    <h2>O que guardamos</h2>
    <ul>
      <li><strong>Conta:</strong> nome, e-mail, tipo de conta (Cliente ou Prestador) e senha, que fica armazenada de forma cifrada.</li>
      <li><strong>Login com Google:</strong> se você escolher essa opção, recebemos seu nome, e-mail e foto de perfil. Não recebemos sua senha do Google.</li>
      <li><strong>Perfil de Prestador:</strong> o que você preencher, como nome de exibição, descrição, localização, contatos, links e ofertas.</li>
      <li><strong>Uso da plataforma:</strong> projetos, propostas, convites e avaliações.</li>
      <li><strong>Sessão:</strong> endereço IP e navegador usados no login, para manter sua sessão e proteger a conta.</li>
    </ul>
    <h2>Como usamos</h2>
    <p>Usamos esses dados para criar e proteger sua conta, mostrar prestadores compatíveis, registrar propostas e aceites, publicar avaliações e enviar e-mails de confirmação e de recuperação de senha. Não vendemos dados, não exibimos anúncios e não usamos ferramentas de análise ou rastreamento de terceiros.</p>
    <h2>O que outras pessoas veem</h2>
    <ul>
      <li>O perfil, as ofertas e os contatos que o Prestador autoriza publicar ficam públicos.</li>
      <li>Avaliações ficam públicas, com o nome de quem avaliou.</li>
      <li>O Prestador vê o projeto e o primeiro nome do Cliente. O nome completo e o e-mail do Cliente só são mostrados ao Prestador cuja proposta foi aceita.</li>
    </ul>
    <h2>Com quem compartilhamos</h2>
    <p>Usamos a Vercel para hospedar o site, a Supabase para o banco de dados e o Google para o login com Google e o envio de e-mails. Esses serviços tratam os dados apenas para fazer a plataforma funcionar. Pagamento e contrato são combinados diretamente entre Cliente e Prestador, fora da Proposta.dev.</p>
    <h2>Cookies e armazenamento no navegador</h2>
    <p>Usamos um cookie para manter você conectado. O navegador também guarda sua seleção de comparação e o rascunho da Triagem, para que você não perca o que estava fazendo.</p>
    <h2>Seus direitos</h2>
    <p>Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir acesso, correção ou exclusão dos seus dados. Nome, perfil e ofertas podem ser editados no painel. Para os demais pedidos, inclusive a exclusão da conta, escreva para o contato abaixo.</p>
    <h2>Contato</h2>
    <p>{contact ? <>Fale com a equipe em <a href={`mailto:${contact}`}>{contact}</a>.</> : "Fale com a equipe do projeto."}</p>
    <p><Link href="/">Voltar ao início</Link></p>
  </article>;
}
