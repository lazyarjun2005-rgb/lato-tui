import logo from "../../assets/brand/logo-lato.png"
import "./wordmark-v2.css"

export function WordmarkV2(props: { class?: string }) {
  return (
    <div
      data-component="wordmark-v2"
      classList={{ [props.class ?? ""]: !!props.class }}
      style={`--wordmark-v2-image: url(${logo})`}
    >
      <div data-slot="wordmark-v2-art" />
    </div>
  )
}
