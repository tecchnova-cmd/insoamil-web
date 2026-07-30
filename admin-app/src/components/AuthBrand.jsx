import logo from '../assets/logo.png';

export default function AuthBrand() {
  return (
    <div className="auth-brand">
      <img src={logo} alt="INSOAMIL" className="auth-logo-img" />
      <div className="auth-logo">INSOAMIL</div>
    </div>
  );
}
