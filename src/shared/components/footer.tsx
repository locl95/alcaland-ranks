import kosggLogo from "@/assets/kosgg.png";
import "./footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <a
        href="https://ko-fi.com/kosgg"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        <img src={kosggLogo} alt="KosGG" className="footer-logo" />
        <span className="footer-text">Support us on Ko-fi</span>
      </a>
    </footer>
  );
}
