import React, { useRef } from "react";
import { Perlin } from "../../../Perlin";
import { reaction } from "mobx";
import { observer, useDisposable } from "mobx-react-lite";
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import "./notification.scss";
import TickIcon from "../../../assets/svg/tick.svg";
import WarningIcon from "../../../assets/svg/warning.svg";
import CloseIcon from "../../../assets/svg/close-icon.svg";
import styled from "styled-components";

const perlin = Perlin.getInstance();

export const InlineNotification = styled.div`
    font-size: 14px;

    padding: 20px;
    display: flex;
    border-radius: 5px;
    margin: 20px 0 0;
    padding: 15px;
    border: solid 1px #65666e;

    .notification-title {
        font-weight: 600;
        font-size: 16px;
        margin-top: 0;
        margin: 3px 0 5px;

        &::first-letter {
            text-transform: uppercase;
        }
    }

    .notification-message {
        color: #aaacb3;
        a {
            font-weight: 600;
            color: inherit;
            margin-left: 5px;
            text-decoration: underline;
        }
    }

    .result {
        display: block;
        margin-top: 5px;

        color: #fff;
    }
    .break {
        word-break: break-all;
    }
    &::before {
        content: "";
        display: inline-block;
        vertical-align: middle;
        width: 25px;
        height: 25px;
        border-radius: 20px;
        margin-right: 15px;
        flex-shrink: 0;
        background-position: center center;
        background-repeat: no-repeat;
    }

    &.success::before {
        background-color: #2ba746;
        background-size: 120% auto;
        background-image: url(${TickIcon});
    }

    &.warning::before {
        background-color: #eab020;
        background-size: 60% auto;
        background-image: url(${WarningIcon});
    }

    &.error::before {
        background-color: #dc3646;
        background-size: 60% auto;
        background-image: url(${WarningIcon});
    }
`;

const notificationTitles = {
    success: "Success",
    danger: "Error",
    warning: "Warning"
};

interface INotificationContentProps {
    title: string;
    type: string;
}
const NotificationContent: React.FunctionComponent<
    INotificationContentProps
> = ({ children, title, type }) => {
    return (
        <div className={"notification-content notification-" + type}>
            <div className="notification-body">
                <h4 className="notification-title">{title}</h4>
                <div className="notification-message">{children}</div>
            </div>
            <div className="notification-close">
                <img src={CloseIcon} />
            </div>
        </div>
    );
};

const Notification: React.FunctionComponent = () => {
    const notificationRef = useRef(null);
    useDisposable(() =>
        reaction(
            () => perlin.notification,
            (notification: any) => {
                const title =
                    notification.title || notificationTitles[notification.type];
                const content = notification.content || (
                    <p>{notification.message}</p>
                );
                // @ts-ignore
                notificationRef.current.addNotification({
                    insert: "top",
                    container: "top-right",
                    animationIn: ["animated", "fadeIn"],
                    animationOut: ["animated", "fadeOut"],
                    dismiss: { duration: 3000 },
                    dismissable: { click: true },
                    ...notification,
                    content: (
                        <NotificationContent
                            title={title}
                            type={notification.type}
                        >
                            {content}
                        </NotificationContent>
                    )
                });
            }
        )
    );

    return <ReactNotification ref={notificationRef} />;
};

export default observer(Notification);
