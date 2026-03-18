import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from "../utils/config";

const DataFilePage = () => {
  const [studies, setStudies] = useState([]);
  const [filteredStudies, setFilteredStudies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const fetchStudies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/studies/`);
      const data = await response.json();
      setStudies(data);
      setFilteredStudies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, []); // bez uploadDoneCounter na razie

  return (
    <div className="data-file-page">
      <h1>Lista badań</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudies.slice(indexOfFirst, indexOfLast).map((study) => (
            <tr key={study.id}>
              <td>{study.id}</td>
              <td>{study.name}</td>
              <td>{study.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataFilePage;