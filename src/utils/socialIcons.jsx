import {
  logoInstagram,
  logoFacebook,
  logoX,
  logoTiktok,
  logoLinkedin,
  logoYoutube,
  logoWhatsapp,
  send,
  globeOutline,
} from "ionicons/icons";
import { defineCustomElement } from "ionicons/components/ion-icon.js";
import { addIcons } from "ionicons/components";

if (typeof customElements !== "undefined" && !customElements.get("ion-icon")) {
  defineCustomElement();
}

addIcons({
  "logo-instagram": logoInstagram,
  "logo-facebook": logoFacebook,
  "logo-x": logoX,
  "logo-tiktok": logoTiktok,
  "logo-linkedin": logoLinkedin,
  "logo-youtube": logoYoutube,
  "logo-whatsapp": logoWhatsapp,
  "logo-telegram": send,
  "send": send,
  "globe-outline": globeOutline,
});

export default function SocialIcon({ name, size = 18, className = "", style }) {
  const resolved = name || "globe-outline";
  return (
    <ion-icon
      name={resolved}
      className={className}
      style={{ fontSize: size, ...style }}
      aria-hidden="true"
    />
  );
}