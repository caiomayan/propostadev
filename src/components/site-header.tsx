import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { Wordmark } from "@/components/wordmark";
import { MobileMenu } from "@/components/mobile-menu";
import { SiteNav } from "@/components/site-nav";
import { accountSummary } from "@/lib/auth/account-summary";
import { getSession } from "@/lib/auth/session";
import { siteLinks } from "@/lib/account-nav";

export async function SiteHeader() {
  // Sem sessão legível (por exemplo, banco indisponível), o cabeçalho cai para "Entrar" em vez de quebrar a página.
  const session = await getSession().catch(() => null);
  const account = session ? await accountSummary(session.user) : null;
  const type = session?.user.accountType === "CLIENTE" || session?.user.accountType === "PRESTADOR" ? session.user.accountType : null;
  const links = siteLinks(type, Boolean(session));
  return <header className="site-header"><div className="container header-inner"><Wordmark/>
    <SiteNav links={links}/>
    {account ? <div className="header-account signed-in"><AccountMenu account={account}/></div> : <div className="header-account"><Link href="/entrar" className="button">Entrar</Link></div>}
    <MobileMenu links={links} signedIn={Boolean(session)}/>
  </div></header>;
}
