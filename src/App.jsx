import { useEffect, useState } from "react";
import { io } from "socket.io-client";

function App() {
  const [orders, setOrders] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Bağlanıyor...");

  const startPreparing = async (orderId) => {
    try {
      const acceptResponse = await fetch(
        `http://localhost:3000/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "ACCEPTED",
          }),
        },
      );

      if (!acceptResponse.ok) {
        throw new Error("Sipariş kabul edilemedi");
      }

      const preparingResponse = await fetch(
        `http://localhost:3000/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "PREPARING",
          }),
        },
      );

      if (!preparingResponse.ok) {
        throw new Error("Sipariş hazırlanıyor durumuna geçirilemedi");
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "PREPARING",
              }
            : order,
        ),
      );
    } catch (error) {
      console.error("Sipariş durumu güncellenemedi:", error);
      alert("Sipariş durumu güncellenemedi.");
    }
  };
const markAsReady = async (orderId) => {
  try {
    const response = await fetch(
      `http://localhost:3000/orders/${orderId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "READY",
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Sipariş hazır durumuna geçirilemedi");
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "READY",
            }
          : order,
      ),
    );
  } catch (error) {
    console.error("Sipariş durumu güncellenemedi:", error);
    alert("Sipariş hazır durumuna geçirilemedi.");
  }
};

  useEffect(() => {
    const loadKitchenOrders = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/orders/kitchen",
        );

        if (!response.ok) {
          throw new Error("Mutfak siparişleri alınamadı");
        }

        const kitchenOrders = await response.json();
        setOrders(kitchenOrders);
      } catch (error) {
        console.error("Siparişler yüklenemedi:", error);
      }
    };

    loadKitchenOrders();

    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("✅ Backend'e bağlandı");
      setConnectionStatus("Backend bağlantısı aktif");
    });

    socket.on("disconnect", () => {
      console.log("❌ Backend bağlantısı kesildi");
      setConnectionStatus("Backend bağlantısı kesildi");
    });

    socket.on("new-order", (order) => {
      console.log("🍽 Yeni Sipariş:", order);

      setOrders((currentOrders) => {
        const orderAlreadyExists = currentOrders.some(
          (currentOrder) => currentOrder.id === order.id,
        );

        if (orderAlreadyExists) {
          return currentOrders;
        }

        return [order, ...currentOrders];
      });
    });
    socket.on("new-order", (order) => {
  console.log("🍽 Yeni Sipariş:", order);

  setOrders((currentOrders) => {
    const orderAlreadyExists = currentOrders.some(
      (currentOrder) => currentOrder.id === order.id,
    );

    if (orderAlreadyExists) {
      return currentOrders;
    }

    return [order, ...currentOrders];
  });
});

socket.on("order-updated", (updatedOrder) => {
  console.log("🔄 Sipariş güncellendi:", updatedOrder);

  setOrders((currentOrders) => {
    if (
      updatedOrder.status === "SERVED" ||
      updatedOrder.status === "CANCELLED"
    ) {
      return currentOrders.filter(
        (order) => order.id !== updatedOrder.id,
      );
    }

    return currentOrders.map((order) =>
      order.id === updatedOrder.id ? updatedOrder : order,
    );
  });
});

return () => {
  socket.disconnect();
};

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#121212",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>🍳 Kitchen Dashboard</h1>

      <p
        style={{
          color:
            connectionStatus === "Backend bağlantısı aktif"
              ? "#4caf50"
              : "#ff9800",
        }}
      >
        ● {connectionStatus}
      </p>

      <h2>Aktif Siparişler ({orders.length})</h2>

      {orders.length === 0 && (
        <div
          style={{
            background: "#1e1e1e",
            padding: "24px",
            borderRadius: "12px",
            marginTop: "20px",
            maxWidth: "500px",
            color: "#bdbdbd",
          }}
        >
          Henüz aktif sipariş yok. Yeni sipariş geldiğinde burada görünecek.
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              background: "#1e1e1e",
              padding: "20px",
              borderRadius: "12px",
              width: "350px",
             borderTop:
  order.status === "READY"
    ? "5px solid #4caf50"
    : order.status === "PREPARING"
      ? "5px solid #2196f3"
      : "5px solid #ff9800",
            }}
          >
            <h3>
              {order.tableSession?.table?.name ??
                `Masa ${order.tableSession?.tableId ?? "Bilinmiyor"}`}
            </h3>

            {order.items?.length > 0 ? (
              order.items.map((item) => (
                <p key={item.id}>
                  {item.menuItem?.name ??
                    item.itemName ??
                    item.name ??
                    "Ürün"}{" "}
                  x{item.quantity ?? 1}
                </p>
              ))
            ) : (
              <p style={{ color: "#bdbdbd" }}>
                Ürün bilgisi bulunamadı.
              </p>
            )}

            {order.note && (
              <div
                style={{
                  background: "#2c2c2c",
                  padding: "10px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                }}
              >
                <strong>Not:</strong> {order.note}
              </div>
            )}

            <button
  onClick={() => {
    if (order.status === "PREPARING") {
      markAsReady(order.id);
    } else if (order.status !== "READY") {
      startPreparing(order.id);
    }
  }}
  disabled={order.status === "READY"}
  style={{
    background:
      order.status === "READY"
        ? "#4caf50"
        : order.status === "PREPARING"
          ? "#2196f3"
          : "#ff9800",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "8px",
    cursor: order.status === "READY" ? "default" : "pointer",
    fontSize: "15px",
  }}
>
  {order.status === "READY"
    ? "Sipariş Hazır"
    : order.status === "PREPARING"
      ? "Hazır Olarak İşaretle"
      : "Hazırlanmaya Başla"}
</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;