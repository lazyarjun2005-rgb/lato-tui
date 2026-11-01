import { type ComponentProps } from "solid-js"
import icon from "../assets/brand/icon-lato.png"
import wordmark from "../assets/brand/logo-lato.png"

export const Mark = (props: { class?: string }) => {
  return <img data-component="logo-mark" src={icon} alt="" classList={{ [props.class ?? ""]: !!props.class }} />
}

export const Splash = (props: Pick<ComponentProps<"img">, "ref" | "class">) => {
  return (
    <img
      ref={props.ref}
      data-component="logo-splash"
      src={icon}
      alt=""
      classList={{ [props.class ?? ""]: !!props.class }}
    />
  )
}

export const Logo = (props: { class?: string }) => {
  return <img data-component="logo" src={wordmark} alt="Lato" classList={{ [props.class ?? ""]: !!props.class }} />
}
