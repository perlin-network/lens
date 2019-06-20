import React, { useRef } from "react";
import { Perlin } from "../../../Perlin";
import { reaction } from "mobx";
import { observer, useDisposable } from "mobx-react-lite";
import ReactNotification from "react-notifications-component";
import "react-notifications-component/dist/theme.css";
import "./notification.scss";
import CloseIcon from "../../../assets/svg/close-icon.svg";

const perlin = Perlin.getInstance();

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
                    notificationTitles[notification.type] || notification.title;
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
