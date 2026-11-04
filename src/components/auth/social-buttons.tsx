import { GithubIcon, GoogleIcon } from "@/components/brand-icons";
import { socialProviderLabels, type SocialProviderId } from "@/lib/auth/providers";
import { socialSignIn } from "@/lib/auth/actions";
import { SocialSubmit } from "./social-submit";

const icons: Record<SocialProviderId, () => React.ReactNode> = { github: GithubIcon, google: GoogleIcon };

// Renderizado só com os provedores habilitados pelo servidor (a página decide a lista).
export function SocialButtons({ providers, next }: { providers: SocialProviderId[]; next?: string | null }) {
  if (providers.length === 0) return null;
  return <div className="social-buttons">
    <p className="social-divider"><span>ou</span></p>
    {providers.map((provider) => {
      const Icon = icons[provider];
      return <form key={provider} action={socialSignIn}><input type="hidden" name="provider" value={provider} />{next && <input type="hidden" name="next" value={next} />}<SocialSubmit icon={<Icon/>} label={provider === "google" ? "o Google" : socialProviderLabels[provider]}/></form>;
    })}
  </div>;
}
