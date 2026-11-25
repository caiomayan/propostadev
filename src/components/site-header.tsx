import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { Wordmark } from "@/components/wordmark";
import { MobileMenu } from "@/components/mobile-menu";
import { AvisosBell } from "@/components/avisos-bell";
import { SiteNav } from "@/components/site-nav";
import { accountSummary } from "@/lib/auth/account-summary";
import { getSession } from "@/lib/auth/session";
import { siteLinks } from "@/lib/account-nav";
import { needsEmailConfirmation } from "@/lib/auth/email-gate";
import { countUnread } from "@/modules/avisos/queries";

export async function SiteHeader() {
  // Sem sessão legível (por exemplo, banco indisponível), o cabeçalho cai para "Entrar" em vez de quebrar a página.
  const session = await getSession().catch(() => null);
  const account = session ? await accountSummary(session.user) : null;
  const type = session?.user.accountType === "CLIENTE" || session?.user.accountType === "PRESTADOR" ? session.user.accountType : null;
  const links = siteLinks(type, Boolean(session));
  // Avisos só para quem já entra no painel (conta com tipo e e-mail confirmado); uma consulta de contagem, e o cabeçalho segue sem o número se ela falhar.
  const unread = session && type && !needsEmailConfirmation(session.user) ? await countUnread(session.user.id).catch(() => null) : null;
  return <header className="site-header"><div className="container header-inner"><Wordmark/>
    <SiteNav links={links}/>
    {account ? <div className="header-account signed-in">{unread !== null && <AvisosBell count={unread}/>}<AccountMenu account={account}/></div> : <div className="header-account"><Link href="/entrar" className="button">Entrar</Link></div>}
    <MobileMenu links={links} signedIn={Boolean(session)} unread={unread}/>
  </div></header>;
}
