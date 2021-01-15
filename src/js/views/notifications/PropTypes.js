import {
    shape, string, boolean,
} from 'prop-types';

const notificationType = shape({
    datetime: string,
    message: string,
    isUTF: boolean,
    metas: shape({}),
});

export default notificationType;
