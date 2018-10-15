import UserModel from 'dashboard/data/user-model';

export default function createUserModel (properties) {
  return new UserModel(properties);
}
