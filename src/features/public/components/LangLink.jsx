import { Link, NavLink } from 'react-router-dom';
import { localizePath } from '../content';
import { useLang } from '../i18n';

// Drop-in replacements for react-router's Link / NavLink that automatically
// prefix internal targets with the active language (#9). Portuguese links stay
// unprefixed; external/hash targets pass through untouched.
export const PubLink = ({ to, ...rest }) => {
  const { lang } = useLang();
  return <Link to={localizePath(to, lang)} {...rest} />;
};

export const PubNavLink = ({ to, ...rest }) => {
  const { lang } = useLang();
  return <NavLink to={localizePath(to, lang)} {...rest} />;
};
