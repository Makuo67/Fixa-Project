import Error from "../components/Error/Error";

export default function Custom404() {
  return (
    <Error status={404} backHome={true} message="Oops... Page not found."/>
  )
}
