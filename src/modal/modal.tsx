import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import React from 'react'

export interface ButtonWithModalProps {
    buttonId: string,
    buttonLabel: string,
    modalTitle: string,
    modalContent: React.ReactNode,
    modalActions: React.ReactNode,
    modalOpen: boolean,
    modalClose: () => void,
    modalConfirm: () => void,
    modalConfirmLabel: string,
    modalCancelLabel: string,
    modalConfirmDisabled: boolean,
    modalConfirmLoading: boolean,
    modalCancelLoading: boolean,
    modalConfirmLoadingLabel: string,
    modalCancelLoadingLabel: string,
}
const ButtonWithModal = (props: ButtonWithModalProps) => {
    const { buttonLabel, modalTitle, modalContent, modalActions, modalClose, modalConfirm, modalConfirmLabel, modalCancelLabel, modalConfirmDisabled, modalConfirmLoading, modalCancelLoading, modalConfirmLoadingLabel, modalCancelLoadingLabel } = props

    const [isOpen, setIsOpen] = React.useState(false)

    // expose a function to parent to open modal
    const openModal = () => {
        setIsOpen(true)
    }


    return (
        <div>
            {/*forward ref button to parent */}
            <Button variant="contained" color="primary" onClick={()=> setIsOpen(true)} >
                {buttonLabel}
            </Button>
            <Dialog open={isOpen} onClose={modalClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">{modalTitle}</DialogTitle>
                <DialogContent>
                    {modalContent}
                </DialogContent>
                <DialogActions>
                    {modalActions}
                </DialogActions>
            </Dialog>
        </div>
    )
}