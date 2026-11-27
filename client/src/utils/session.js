import Cookies from 'js-cookie';

const USER_COOKIE = 'hd_user';

export const saveUser = (user) => {
  Cookies.set(
    USER_COOKIE,
    JSON.stringify({ _id: user._id, name: user.name, email: user.email, role: user.role }),
    { expires: 1, sameSite: 'strict', secure: window.location.protocol === 'https:' }
  );
};

export const getSavedUser = () => {
  try {
    const raw = Cookies.get(USER_COOKIE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearUser = () => Cookies.remove(USER_COOKIE);
