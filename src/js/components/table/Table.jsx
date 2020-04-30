import React from 'react';
import moment from 'moment';
import PropTypes from "prop-types";
import styles from './style.scss';


const Table = (props) => {
    const {
        itemList = [], isFetching, t,
    } = props;

    const row = itemList.map((item) => {
        const {
            attr, value, ts,
        } = item;
        return (
            <tr>
                <td>{attr}</td>
                <td>
                    {
                        typeof (value) === 'object' ? JSON.stringify(value)
                            : value.toString()
                    }
                </td>
                <td>{moment(ts).format('DD/MM/YYYY HH:mm:ss')}</td>

            </tr>
        );
    });

    const tableHTML = (
        <div className={styles.tableScrollable}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>{t('report:reports.attr')}</th>
                        <th>{t('report:reports.value')}</th>
                        <th>{t('report:reports.date')}</th>
                    </tr>
                </thead>
                <tbody>
                    {row}
                </tbody>
            </table>
        </div>
    );
    return (
        <div className={styles.tableContainer}>
            {isFetching ? <div className={styles.tableScrollable} /> : tableHTML}
        </div>
    );
};

Table.propTypes = {
    itemList: PropTypes.array.isRequired,
    isFetching: PropTypes.bool,
    t: PropTypes.func.isRequired,
};

export default Table;
