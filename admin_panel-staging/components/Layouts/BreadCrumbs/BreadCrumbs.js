import { Breadcrumb, Divider } from "antd";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getBalance } from "../../../redux/actions/user.actions";
import { useDispatch, useSelector } from "react-redux";
import NumberFormat from "../../shared/NumberFormat";
import { capitalize } from "../../../helpers/excelRegister";
import { getPaymentData } from "../../../helpers/auth";

const BreadCrumbs = (props) => {
  const [payment, setPayment] = useState(null);
  const router = useRouter();
  const routerCrumbs = router.asPath;
  const balance =
    useSelector((state) => state.user.balance?.availableBalance) || 0;

  const dispatch = useDispatch();
  let paymentTitle = "";

  useEffect(() => {
    if (props.isPayment || props.isSinglePayment) {
      dispatch(getBalance());
      getPaymentData().then((res) => {
        if (res) {
          // console.log(">>>res breadcrumbs", res.payment);
          paymentTitle = res.payment;
          setPayment(res.payment);
        }
      });
    }
  }, [router.isReady, router]);

  let query = routerCrumbs.split("?")[1];
  let list = routerCrumbs.split("?")[0].split("/");
  const toTitle = (slug) => {
    return slug
      .replace(/-/g, " ")
      .replace(/%20/g, " ")
      .replace(/%5B/g, "")
      .replace(/%5D/g, "")
      .replace(/_/g, " ")
      .replace(/%3A/g, ":")
      .replace(/%3B/g, ";")
      .replace(/\b[a-z]/g, function () {
        return arguments[0].toUpperCase();
      })
      .replace("[", "")
      .replace("]", "");
  };

  const breadItems = (list) => {
    return list.map((item, index) => {
      const title = item ? <Link href={`/${item}`}>{item}</Link> : <Link href="/">Dashbaord</Link>;
      return { title };
    });
  }

  return (
    <div>
      {list[1] == "finance" || props.isPayment ? (
        <div style={{ display: "flex", justifyContent: "space-between " }}>
          <Breadcrumb
            items={breadItems(list)}
          />
          <div>
            <p
              style={{
                background: "#DFF3FB",
                padding: "3px",
                borderRadius: "2px",
                color: "#0291C8",
                fontWeight: "700",
                fontSize: "16px",
                lineHeight: "20px",
                textAlign: "center",
              }}
            >
              Balance: RWF <NumberFormat value={balance} />
            </p>
          </div>
        </div>
      ) : (
        <div>
          <Breadcrumb
            separator=">"
            style={{ marginLeft: props.isWorkerProfile ? "80px" : "0px" }}
          >
            {list.length === 0 || <Link href="/">Dashboard</Link>}
            <>
              {list.map((item, index) => (
                index === list.length - 1 ? (
                  <Breadcrumb.Item separator="" key={index}>
                    {toTitle(item)}
                  </Breadcrumb.Item>
                ) : (
                  <Breadcrumb.Item key={index}>
                    <a onClick={() => router.back()}>{toTitle(item)}</a>
                  </Breadcrumb.Item>
                )
              ))}
            </>
          </Breadcrumb>
        </div>
      )}
    </div>
  );
};

export default BreadCrumbs;
