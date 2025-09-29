import React from "react";
import Button from "../ui/button/Button";
import 'react-responsive-modal/styles.css';
import { Modal } from 'react-responsive-modal';

export default function QuizzView() {
    const [openFirst, setOpenFirst] = React.useState(false);
    return (
        <>
            <Button size="sm" variant="primary" onClick={() => {
                setOpenFirst(true)
            }}>
                Xem
            </Button>

            <Modal open={openFirst} onClose={() => setOpenFirst(false)} center>
                <p>First modal</p>
                asdasdasasd
            </Modal>
        </>
    )
}