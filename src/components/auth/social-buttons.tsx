import { socialProviderLabels, type SocialProviderId } from "@/lib/auth/providers";
import { socialSignIn } from "@/lib/auth/actions";

// Renderizado só com os provedores habilitados pelo servidor (a página decide a lista).
export function SocialButtons({ providers, next }: { providers: SocialProviderId[]; next?: string | null }) {
  if (providers.length === 0) return null;
  return <div className="stack social-buttons" style={{ gap: 12 }}>
    <p className="muted" style={{ textAlign: "center", margin: 0 }}>ou continue com</p>
    {providers.map((provider) => <form key={provider} action={socialSignIn}><input type="hidden" name="provider" value={provider} />{next && <input type="hidden" name="next" value={next} />}<button type="submit" className="button secondary" style={{ width: "100%" }}>{socialProviderLabels[provider]}</button></form>)}
  </div>;
}
