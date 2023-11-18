import md5 from 'md5';

export const getCurrentTime = () => {
  return Math.floor(new Date().getTime() / 1000).toString(16);
};

export const createAccountToken = (
  userId,
  organizationId,
  key,
  firstName,
  lastName,
  phoneNumber,
  countryId,
  regionId,
  cityName,
  postalCode,
  eMail
) => {
  const currentTime = getCurrentTime();
  const signature = md5(
    `${organizationId}:${userId}:${firstName}:${lastName}:${countryId}:${regionId}:${postalCode}:${cityName}:${phoneNumber}:${currentTime}:${key}`
  );

  return '01' + currentTime + signature;
};

export const convertDuration = (dur) => {
  const dS = Number(dur);

  const h = Math.floor(dS / 3600);
  const m = Math.floor((dS % 3600) / 60);
  const s = Math.floor((dS % 3600) % 60);
  if (h > 0 && m > 0 && s > 0) {
    return `${h} h ${m} m ${s} s`;
  } else if (h > 0 && m === 0) {
    return `${h} h`;
  } else if (h === 0 && m > 0) {
    return `${m} m ${s} s`;
  } else if (h === 0 && m === 0 && s > 0) {
    return ` ${s} s`;
  } else {
    return '0 s';
  }
};
