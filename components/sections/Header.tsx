import { resolveCompany } from "@/lib/site-settings";
import { HeaderClient } from "./HeaderClient";

/**
 * The site header. A server wrapper so the phone number and the menu's
 * contact block follow Admin → Settings, like the footer does — the header
 * itself runs in the browser and cannot read Settings on its own.
 */
export async function Header() {
  return <HeaderClient company={await resolveCompany()} />;
}
